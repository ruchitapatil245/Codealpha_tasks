from django.core.management.base import BaseCommand
from store.models import Category, Product

PRODUCTS = [
    {
        'category': 'Electronics',
        'name': 'Wireless Headphones',
        'slug': 'wireless-headphones',
        'description': 'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality for music lovers.',
        'price': 149.99,
        'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
        'stock': 25,
        'featured': True,
    },
    {
        'category': 'Electronics',
        'name': 'Smart Watch Pro',
        'slug': 'smart-watch-pro',
        'description': 'Track your fitness, receive notifications, and stay connected with this sleek smartwatch featuring heart rate monitoring and GPS.',
        'price': 299.99,
        'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
        'stock': 18,
        'featured': True,
    },
    {
        'category': 'Electronics',
        'name': 'Portable Bluetooth Speaker',
        'slug': 'bluetooth-speaker',
        'description': 'Compact waterproof speaker with 360° sound, 12-hour playtime, and deep bass — perfect for outdoor adventures.',
        'price': 79.99,
        'image_url': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
        'stock': 40,
        'featured': False,
    },
    {
        'category': 'Fashion',
        'name': 'Classic Leather Sneakers',
        'slug': 'leather-sneakers',
        'description': 'Handcrafted leather sneakers with cushioned insoles and timeless design. Comfortable for all-day wear.',
        'price': 129.99,
        'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
        'stock': 30,
        'featured': True,
    },
    {
        'category': 'Fashion',
        'name': 'Minimalist Backpack',
        'slug': 'minimalist-backpack',
        'description': 'Sleek water-resistant backpack with laptop compartment, hidden pockets, and ergonomic straps for daily commutes.',
        'price': 89.99,
        'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
        'stock': 22,
        'featured': False,
    },
    {
        'category': 'Fashion',
        'name': 'Aviator Sunglasses',
        'slug': 'aviator-sunglasses',
        'description': 'UV400 protection polarized lenses in a classic aviator frame. Lightweight metal build with anti-glare coating.',
        'price': 59.99,
        'image_url': 'https://images.unsplash.com/photo-1572635196233-14f4f7910d7d?w=600&h=600&fit=crop',
        'stock': 50,
        'featured': False,
    },
    {
        'category': 'Home',
        'name': 'Ceramic Plant Pot Set',
        'slug': 'ceramic-plant-pots',
        'description': 'Set of 3 handcrafted ceramic pots in earthy tones with drainage holes. Perfect for succulents and small plants.',
        'price': 45.99,
        'image_url': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop',
        'stock': 35,
        'featured': True,
    },
    {
        'category': 'Home',
        'name': 'Scented Candle Collection',
        'slug': 'scented-candles',
        'description': 'Luxury soy wax candles in lavender, vanilla, and cedarwood scents. 45-hour burn time each, set of 3.',
        'price': 39.99,
        'image_url': 'https://images.unsplash.com/photo-1602609640224-3bae73764b44?w=600&h=600&fit=crop',
        'stock': 60,
        'featured': False,
    },
    {
        'category': 'Home',
        'name': 'Modern Desk Lamp',
        'slug': 'modern-desk-lamp',
        'description': 'Adjustable LED desk lamp with warm/cool light modes, touch controls, and USB charging port built in.',
        'price': 54.99,
        'image_url': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop',
        'stock': 28,
        'featured': False,
    },
    {
        'category': 'Sports',
        'name': 'Yoga Mat Premium',
        'slug': 'yoga-mat-premium',
        'description': 'Extra-thick non-slip yoga mat with alignment lines. Eco-friendly TPE material, includes carrying strap.',
        'price': 49.99,
        'image_url': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop',
        'stock': 45,
        'featured': False,
    },
    {
        'category': 'Sports',
        'name': 'Insulated Water Bottle',
        'slug': 'insulated-water-bottle',
        'description': '32oz stainless steel bottle keeps drinks cold 24hrs or hot 12hrs. Leak-proof lid with wide mouth opening.',
        'price': 34.99,
        'image_url': 'https://images.unsplash.com/photo-1602143404851-0bebf6787d5a?w=600&h=600&fit=crop',
        'stock': 55,
        'featured': False,
    },
    {
        'category': 'Sports',
        'name': 'Resistance Band Set',
        'slug': 'resistance-band-set',
        'description': '5-level resistance bands with handles, door anchor, and ankle straps. Full-body workout at home or gym.',
        'price': 29.99,
        'image_url': 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=600&fit=crop',
        'stock': 70,
        'featured': False,
    },
]


class Command(BaseCommand):
    help = 'Seed the database with sample products and categories'

    def handle(self, *args, **options):
        if Product.objects.exists():
            self.stdout.write(self.style.WARNING('Products already exist. Skipping seed.'))
            return

        categories = {}
        for item in PRODUCTS:
            cat_name = item['category']
            if cat_name not in categories:
                slug = cat_name.lower()
                categories[cat_name], _ = Category.objects.get_or_create(
                    name=cat_name,
                    defaults={'slug': slug},
                )

        for item in PRODUCTS:
            Product.objects.create(
                category=categories[item['category']],
                name=item['name'],
                slug=item['slug'],
                description=item['description'],
                price=item['price'],
                image_url=item['image_url'],
                stock=item['stock'],
                featured=item['featured'],
            )

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(PRODUCTS)} products across {len(categories)} categories.'))
