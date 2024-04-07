FROM python:3.7.4

WORKDIR /app

COPY ./back-end /app

RUN chmod +x /app/boot.sh

RUN pip install -r requirements.txt && pip install pymysql gunicorn pyopenssl

ENV FLASK_APP madblog.py
EXPOSE 5000
ENTRYPOINT ["bash", "/app/boot.sh"]
