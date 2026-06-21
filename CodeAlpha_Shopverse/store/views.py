from decimal import Decimal

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .cart import Cart
from .forms import CheckoutForm, RegisterForm
from .models import Category, Order, OrderItem, Product
from django.contrib.auth import logout

def logout_view(request):
    logout(request)
    return redirect('store:product_list')


def product_list(request):
    category_slug = request.GET.get('category')
    search = request.GET.get('q', '').strip()
    products = Product.objects.select_related('category').all()

    if category_slug:
        products = products.filter(category__slug=category_slug)
    if search:
        products = products.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    categories = Category.objects.all()
    featured = Product.objects.filter(featured=True)[:4]
    cart = Cart(request)

    return render(request, 'store/product_list.html', {
        'products': products,
        'categories': categories,
        'featured': featured,
        'active_category': category_slug,
        'search_query': search,
        'cart_count': len(cart),
    })


def product_detail(request, slug):
    product = get_object_or_404(Product.objects.select_related('category'), slug=slug)
    related = Product.objects.filter(category=product.category).exclude(pk=product.pk)[:4]
    cart = Cart(request)

    return render(request, 'store/product_detail.html', {
        'product': product,
        'related_products': related,
        'cart_count': len(cart),
    })


@require_POST
def cart_add(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    cart = Cart(request)
    quantity = int(request.POST.get('quantity', 1))

    if quantity < 1:
        messages.error(request, 'Quantity must be at least 1.')
    elif quantity > product.stock:
        messages.error(request, f'Only {product.stock} items available in stock.')
    else:
        cart.add(product, quantity)
        messages.success(request, f'"{product.name}" added to cart.')

    next_url = request.POST.get('next')
    if next_url:
        return redirect(next_url)
    return redirect('store:product_list')


@require_POST
def cart_update(request, product_id):
    cart = Cart(request)
    quantity = int(request.POST.get('quantity', 1))
    cart.update(product_id, quantity)
    messages.success(request, 'Cart updated.')
    return redirect('store:cart_detail')


@require_POST
def cart_remove(request, product_id):
    cart = Cart(request)
    cart.remove(product_id)
    messages.success(request, 'Item removed from cart.')
    return redirect('store:cart_detail')


def cart_detail(request):
    cart = Cart(request)
    return render(request, 'store/cart.html', {
        'cart': cart,
        'cart_count': len(cart),
    })


@login_required
def checkout(request):
    cart = Cart(request)
    if len(cart) == 0:
        messages.warning(request, 'Your cart is empty.')
        return redirect('store:product_list')

    initial = {
        'shipping_name': request.user.get_full_name() or request.user.username,
        'shipping_email': request.user.email,
    }

    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        if form.is_valid():
            return place_order(request, cart, form.cleaned_data)
    else:
        form = CheckoutForm(initial=initial)

    return render(request, 'store/checkout.html', {
        'cart': cart,
        'form': form,
        'cart_count': len(cart),
    })


@transaction.atomic
def place_order(request, cart, shipping_data):
    for item in cart:
        product = Product.objects.select_for_update().get(pk=item['product'].pk)
        if item['quantity'] > product.stock:
            messages.error(
                request,
                f'Not enough stock for "{product.name}". Only {product.stock} left.',
            )
            return redirect('store:cart_detail')

    order = Order.objects.create(
        user=request.user,
        total=cart.total,
        **shipping_data,
    )

    for item in cart:
        product = Product.objects.select_for_update().get(pk=item['product'].pk)
        product.stock -= item['quantity']
        product.save()
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=item['quantity'],
            price=item['price'],
        )

    cart.clear()
    messages.success(request, f'Order #{order.pk} placed successfully!')
    return redirect('store:order_detail', order_id=order.pk)


@login_required
def order_detail(request, order_id):
    order = get_object_or_404(Order.objects.prefetch_related('items__product'), pk=order_id, user=request.user)
    cart = Cart(request)
    return render(request, 'store/order_detail.html', {
        'order': order,
        'cart_count': len(cart),
    })


@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user).prefetch_related('items__product')
    cart = Cart(request)
    return render(request, 'store/order_history.html', {
        'orders': orders,
        'cart_count': len(cart),
    })


def register(request):
    if request.user.is_authenticated:
        return redirect('store:product_list')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Welcome! Your account has been created.')
            return redirect('store:product_list')
    else:
        form = RegisterForm()

    cart = Cart(request)
    return render(request, 'store/register.html', {
        'form': form,
        'cart_count': len(cart),
    })


class CustomLoginView(LoginView):
    template_name = 'store/login.html'
    redirect_authenticated_user = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['cart_count'] = len(Cart(self.request))
        return context
