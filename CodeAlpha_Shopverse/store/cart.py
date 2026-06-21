from decimal import Decimal

from .models import Product


class Cart:
    def __init__(self, request):
        self.session = request.session
        cart = self.session.get('cart')
        if not cart:
            cart = self.session['cart'] = {}
        self.cart = cart

    def add(self, product, quantity=1):
        product_id = str(product.id)
        if product_id in self.cart:
            self.cart[product_id]['quantity'] += quantity
        else:
            self.cart[product_id] = {
                'quantity': quantity,
                'price': str(product.price),
            }
        self.save()

    def update(self, product_id, quantity):
        product_id = str(product_id)
        if product_id in self.cart:
            if quantity > 0:
                self.cart[product_id]['quantity'] = quantity
            else:
                self.remove(product_id)
            self.save()

    def remove(self, product_id):
        product_id = str(product_id)
        if product_id in self.cart:
            del self.cart[product_id]
            self.save()

    def clear(self):
        del self.session['cart']
        self.save()

    def save(self):
        self.session.modified = True

    def __iter__(self):
        product_ids = self.cart.keys()
        products = Product.objects.filter(id__in=product_ids)
        products_map = {str(p.id): p for p in products}

        for product_id, item in self.cart.items():
            product = products_map.get(product_id)
            if product:
                yield {
                    'product': product,
                    'quantity': item['quantity'],
                    'price': Decimal(item['price']),
                    'subtotal': Decimal(item['price']) * item['quantity'],
                }

    def __len__(self):
        return sum(item['quantity'] for item in self.cart.values())

    @property
    def total(self):
        return sum(
            Decimal(item['price']) * item['quantity']
            for item in self.cart.values()
        )

    @property
    def item_count(self):
        return len(self.cart)
