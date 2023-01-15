import uuid
import string
import random
import io
import base64
#import qrcode

from .constants import *

def gen_uid(len=UID_LENGTH):
  # available for search
  lower = string.ascii_lowercase
  upper = string.ascii_uppercase
  num = string.digits
  all = lower + upper + num
  temp = random.sample(all,len)
  password = "".join(temp)
  return(password)

def gen_uuid_str():
    return str(uuid.uuid4())

def gen_wordcode(prefix="",len_1=4,len_2=0,delim=""):
  word1 = gen_uid(len=len_1)
  word2 = gen_uid(len=len_2)
  return f"{prefix}{delim}{word1}{delim}{word2}".upper()

def gen_otp(len_1=3,len_2=3,delim="-"):
  num = string.digits
  word1 = "".join(random.sample(num,len_1))
  word2 = "".join(random.sample(num,len_2))
  return f"{word1}{delim}{word2}".upper()

def gen_base64_qr_code(urlstr):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=4,
        border=4,
    )
    qr.add_data(urlstr)
    qr.make(fit=True)
    img = qr.make_image()
    buffered = io.BytesIO()
    #img.save(buffered, format="SVG")
    buffered.flush()
    #img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return urlstr#"data:image/svg;base64," + img_str