from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

INPUT_CLASS = 'form-input'


class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={'class': INPUT_CLASS}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name in ('password1', 'password2'):
            self.fields[name].widget.attrs['class'] = INPUT_CLASS
        self.fields['email'].widget.attrs['class'] = INPUT_CLASS

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user


class CheckoutForm(forms.Form):
    shipping_name = forms.CharField(max_length=200, label='Full Name', widget=forms.TextInput(attrs={'class': INPUT_CLASS}))
    shipping_email = forms.EmailField(label='Email', widget=forms.EmailInput(attrs={'class': INPUT_CLASS}))
    shipping_address = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3, 'class': INPUT_CLASS}),
        label='Address',
    )
    shipping_city = forms.CharField(max_length=100, label='City', widget=forms.TextInput(attrs={'class': INPUT_CLASS}))
    shipping_zip = forms.CharField(max_length=20, label='ZIP Code', widget=forms.TextInput(attrs={'class': INPUT_CLASS}))
