FROM python:3.7.4

COPY ./back-end ./docker/app
WORKDIR ./docker/app

RUN pip install -r requirements.txt && pip install pymysql gunicorn pyopenssl

ENV FLASK_APP madblog.py
EXPOSE 5000
ENTRYPOINT ["bash", "./docker/app/boot.sh"]
