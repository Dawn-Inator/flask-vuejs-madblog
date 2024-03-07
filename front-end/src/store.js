function parseToken(token) {
  try {
    if (!token) {
      return { user_id: 0 }; // 如果没有token，直接返回默认user_id
    }
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error('Invalid token'); // 如果token格式不正确，抛出错误
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (e) {
    console.error('Failed to parse the token:', e);
    return { user_id: 0 }; // 解析失败时，返回默认user_id
  }
}

export default {
  debug: true,
  state: {
    is_authenticated: !!window.localStorage.getItem('madblog-token'),
    user_id: parseToken(window.localStorage.getItem('madblog-token')).user_id,
  },
  loginAction() {
    if (this.debug) console.log('loginAction triggered');
    const payload = parseToken(window.localStorage.getItem('madblog-token'));
    this.state.is_authenticated = true;
    this.state.user_id = payload.user_id;
  },
  logoutAction() {
    if (this.debug) console.log('logoutAction triggered');
    window.localStorage.removeItem('madblog-token');
    this.state.is_authenticated = false;
    this.state.user_id = 0;
  }
}
