from flask import Flask, request, send_from_directory, render_template
import base64
from io import BytesIO

from image_cook import *

app = Flask(__name__,
    static_url_path="", 
    static_folder="web/static",
    template_folder="web/templates"
)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/test", methods=["POST"])
def test():
    try:
        # Get the base64 string from the form data
        startImageBase64 = request.form.get("startImage")
        code = request.form.get("code")
        binary_data = base64.b64decode(startImageBase64)
        image_stream = BytesIO(binary_data)
        image = Image.open(image_stream)
        cooker = ImageCooker(image, seed=startImageBase64)
        cooker.run(code)
        return cooker.export_base64()
    except Exception as e:
        raise e
        return f"Error: {str(e)}"

if __name__ == "__main__":
    app.run(debug=True)
