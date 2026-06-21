# ShopVerse — E-Commerce Store

A full-featured e-commerce website built with **Django**, **HTML**, **CSS**, and **JavaScript**.

## Features

- **Product listings** with category filters and search
- **Product detail pages** with quantity selector
- **Shopping cart** (session-based)
- **User registration & login**
- **Checkout & order processing**
- **Order history** for logged-in users
- **SQLite database** for products, users, and orders
- **Django Admin** panel for managing inventory

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | Django 6                |
| Frontend | HTML, CSS, JavaScript   |
| Database | SQLite                  |
| Auth     | Django built-in auth    |

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. One-command setup (recommended)

```bash
python manage.py setup_shop
python manage.py runserver
```

Or on Windows, double-click **`run.bat`** — it installs deps, migrates, seeds data, creates users, and starts the server.

### 4. Manual setup

```bash
python manage.py migrate
python manage.py seed_products
python manage.py setup_shop
python manage.py runserver
```

### 5. Create an admin user manually (optional)

```bash
python manage.py createsuperuser
```

```bash
python manage.py runserver
```

Open **http://127.0.0.1:8000/** in your browser.

## Default Accounts

| Role  | Username | Password  |
|-------|----------|-----------|
| Shopper (demo) | `demo` | `demo123` |
| Admin panel    | `admin` | `admin123` |

## Pages

| URL              | Description                |
|------------------|----------------------------|
| `/`              | Product listing (home)     |
| `/product/<slug>/` | Product detail page      |
| `/cart/`         | Shopping cart              |
| `/checkout/`     | Checkout (login required)  |
| `/orders/`       | Order history              |
| `/register/`     | Create account             |
| `/login/`        | Sign in                    |
| `/admin/`        | Django admin panel         |

## Project Structure

```
ecommerce/
├── manage.py
├── requirements.txt
├── shop/                  # Django project settings
├── store/                 # Main app (models, views, cart)
│   ├── models.py          # Product, Category, Order
│   ├── cart.py            # Session cart logic
│   ├── views.py           # All page views
│   └── management/        # seed_products command
├── templates/store/       # HTML templates
└── static/                # CSS & JavaScript
    ├── css/style.css
    └── js/main.js
```

## Demo Flow

1. Browse products on the home page
2. Click a product to view details
3. Add items to cart
4. Register a new account
5. Proceed to checkout and place an order
6. View order confirmation and history
