import bcrypt
print('bcrypt module attributes:')
attrs = dir(bcrypt)
for attr in attrs:
    value = getattr(bcrypt, attr, None)
    print(f'  {attr}: {repr(value)[:100]}')

print('\nChecking for __about__ module:')
try:
    import bcrypt.__about__
    print('  bcrypt.__about__ exists')
    print(f'  dir(bcrypt.__about__): {dir(bcrypt.__about__)}')
    if hasattr(bcrypt.__about__, '__version__'):
        print(f'  bcrypt.__about__.__version__: {bcrypt.__about__.__version__}')
except ImportError:
    print('  bcrypt.__about__ does not exist as a separate module')

print('\nChecking __version__ directly:')
print(f'  bcrypt.__version__: {bcrypt.__version__}')
