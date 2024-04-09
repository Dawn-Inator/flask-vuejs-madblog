from flask import Flask
from flask_mail import Mail, Message

# 创建 Flask 应用实例仅用于配置 Flask-Mail
app = Flask(__name__)

# 配置 Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'your_email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your_password'

# 初始化 Flask-Mail
mail = Mail(app)

# 创建并发送邮件
def send_email():
    try:
        msg = Message("Test Email from Docker Container",
                      sender="your_email@gmail.com",
                      recipients=["receiver_email@example.com"])
        msg.body = "Hi,\nThis is a test email sent from a Docker container."
        msg.html = "<html><body><p>Hi,<br>This is a <b>test email</b> sent from a <i>Docker container</i>.</p></body></html>"

        with app.app_context():
            mail.send(msg)
        print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")

if __name__ == "__main__":
    send_email()
