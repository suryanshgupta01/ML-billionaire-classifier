from flask import Flask, request, jsonify
import joblib
import json
import numpy as np
import cv2
import pywt
from flask_cors import CORS
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
import translators as ts
from io import BytesIO
import base64
import os

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', "AIzaSyCKw-KUsCU64qSuFaRA1s5Tm8fJ4vrHV0w") # test API
genai.configure(api_key=GOOGLE_API_KEY)
modelAI = genai.GenerativeModel('gemini-pro-vision')

app = Flask(__name__)
CORS(app)

@app.route('/classify_image', methods=['POST'])
def classify_image():
    image_data = request.form['image_data']
    response = jsonify(classify_image(image_data))
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/fetch_gemini', methods=['POST'])
def fetch_gemini():
    image = request.form['image_data']
    img = base64_to_pillow_image(image)
    response = modelAI.generate_content(img)
    answer = response.text
    answer = ts.translate_text(answer,translator='google', to_language='en')
    return jsonify({'gemini_response':answer})

@app.route('/healthy',methods=['GET'])
def healthy():
    return jsonify({'health':'Server is healthy 🟢'})

def base64_to_pillow_image(base64_string):
    if base64_string.startswith('data:image'):
        base64_data = base64_string.split(',')[1]
    else:
        base64_data = base64_string

    # Decode base64 data
    image_data = base64.b64decode(base64_data)

    # Create a BytesIO object to simulate a file-like object
    image_stream = BytesIO(image_data)

    # Open the image using Pillow (PIL)
    pillow_image = Image.open(image_stream)

    return pillow_image

__class_name_to_number = {}
__class_number_to_name = {}
__model = None

def classify_image(image_base64_data, file_path=None):
    imgs = get_cropped_image(file_path, image_base64_data)
    result = []
    for img in imgs:
        scalled_raw_img = cv2.resize(img, (32, 32))
        img_har = w2d(img, 'db1', 5)
        scalled_img_har = cv2.resize(img_har, (32, 32))
        combined_img = np.vstack((scalled_raw_img.reshape(32 * 32 * 3, 1), scalled_img_har.reshape(32 * 32, 1)))

        len_image_array = 32*32*3 + 32*32

        final = combined_img.reshape(1,len_image_array).astype(float)
        result.append({
            'class': __class_number_to_name[__model.predict(final)[0]],
            'class_probability': np.around(__model.predict_proba(final)*100,2).tolist()[0],
            'class_dictionary': __class_name_to_number
        })

    return result

def load_saved_artifacts():
    print("loading saved artifacts...start")
    global __class_name_to_number
    global __class_number_to_name

    with open('./class_dictionary.json', "r") as f:
        __class_name_to_number = json.load(f)
        __class_number_to_name = {v:k for k,v in __class_name_to_number.items()}

    global __model
    if __model is None:
        with open('./saved_model.pkl', 'rb') as f:
            print("loaded model from saved_model.pkl")
            __model = joblib.load(f)
    print("loading saved artifacts...done")


def get_cv2_image_from_base64_string(b64str):
    encoded_data = b64str.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def get_cropped_image(image_path, image_base64_data):
    face_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_frontalface_default.xml')
    
    if image_path:
        img = cv2.imread(image_path)
    else:
        img = get_cv2_image_from_base64_string(image_base64_data)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    cropped_faces = []
    for (x,y,w,h) in faces:
            roi_color = img[y:y+h, x:x+w]
            cropped_faces.append(roi_color)
    return cropped_faces


def w2d(img, mode='haar', level=1):
    imArray = img
    #Datatype conversions
    #convert to grayscale
    imArray = cv2.cvtColor( imArray,cv2.COLOR_RGB2GRAY )
    #convert to float
    imArray =  np.float32(imArray)
    imArray /= 255;
    # compute coefficients
    coeffs=pywt.wavedec2(imArray, mode, level=level)

    #Process Coefficients
    coeffs_H=list(coeffs)
    coeffs_H[0] *= 0;

    # reconstruction
    imArray_H=pywt.waverec2(coeffs_H, mode);
    imArray_H *= 255;
    imArray_H =  np.uint8(imArray_H)

    return imArray_H

# development
# if __name__ == "__main__":
#     print("Starting Python Flask Server For Billionaire Image Classification")
#     load_saved_artifacts()
#     app.run(debug=True)

# production
load_saved_artifacts()