# front-end\src\store.js
```
export default {
  debug: true,
  state: {
    is_authenticated: window.localStorage.getItem('madblog-token') ? true : false,
    // 用户登录后，就算刷新页面也能再次计算出 user_id
    user_id: window.localStorage.getItem('madblog-token') ? JSON.parse(atob(window.localStorage.getItem('madblog-token').split('.')[1])).user_id : 0,
    // 用户登录后，就算刷新页面也能再次计算出 user_name
    user_name: window.localStorage.getItem('madblog-token') ? JSON.parse(atob(window.localStorage.getItem('madblog-token').split('.')[1])).user_name : '',
    // 用户登录后，就算刷新页面也能再次计算出 user_avatar
    // 后端传 URL 必须先用 base64 编码，所以这里还要多进行一次 atob 解码 base64 字符串
    user_avatar: window.localStorage.getItem('madblog-token') ? atob(JSON.parse(atob(window.localStorage.getItem('madblog-token').split('.')[1])).user_avatar) : '',
    // 用户登录后，就算刷新页面也能再次计算出 user_perms
    user_perms: window.localStorage.getItem('madblog-token') ? atob(JSON.parse(atob(window.localStorage.getItem('madblog-token').split('.')[1])).permissions).split(",") : ''
  },
```

# back-end\app\utils\models.py
```
#line:377
def get_jwt(self, expires_in=3600):
    '''用户登录后，发放有效的 JWT'''
    now = datetime.utcnow()
    payload = {
        'user_id': self.id,
        'confirmed': self.confirmed,
        'user_name': self.name if self.name else self.username,
        'user_avatar': base64.b64encode(self.avatar(24).encode('utf-8')).decode('utf-8'),
        'permissions': self.role.get_permissions() if self.role else [],
        'exp': now + timedelta(seconds=expires_in),
        'iat': now
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256').decode('utf-8')
```
