# set version of python base image
FROM python:3.9

# set working directory inside of Docker container
WORKDIR /code

# copy all requirements
COPY ./requirements.txt /code/requirements.txt

# install all requirements
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy Public PEM from AWS
COPY ./app/rds-combined-ca-bundle.pem /code/rds-combined-ca-bundle.pem

# copy app (API) code
COPY ./app /code/app

# run server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80", "--workers", "4"]