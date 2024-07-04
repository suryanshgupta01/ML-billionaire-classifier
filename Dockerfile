FROM python:3.10

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && \
    apt-get install -y libgl1-mesa-glx
    
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# CMD ["gunicorn","server:app"]
CMD ["gunicorn", "--bind", ":8000", "server:app"]