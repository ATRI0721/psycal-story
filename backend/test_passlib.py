import sys
sys.path.insert(0, 'psycal-story/Lib/site-packages')
from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    print('CryptContext created successfully')
    
    print('Testing password hash:')
    hashed = pwd_context.hash('testpassword')
    print(f'Hashed password: {hashed}')
    
    print('Testing password verification:')
    result = pwd_context.verify('testpassword', hashed)
    print(f'Verification result: {result}')
    
    print('Testing wrong password:')
    wrong_result = pwd_context.verify('wrongpassword', hashed)
    print(f'Wrong password verification result: {wrong_result}')
    
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
