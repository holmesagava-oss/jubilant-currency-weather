import os
from flask import Flask, request, jsonify
from flask_cors import CORS  
import pymysql
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/')
def home():
    return jsonify({"message": "Currency API Backend is running successfully!"})

# Настройки почты из переменных среды с принудительной очисткой от скрытых пробелов и переносов строк
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.yandex.ru').strip()
SMTP_PORT = int(os.getenv('SMTP_PORT', '465').strip())
SMTP_USER = os.getenv('SMTP_USER', '').strip()
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '').strip()

# Безопасный запуск: если SENDER_EMAIL не задан или отличается, используем SMTP_USER
# Яндекс жестко требует, чтобы почта отправлялась ИМЕННО с того ящика, под которым зашли
SENDER_EMAIL = os.getenv('SENDER_EMAIL', SMTP_USER).strip()
if not SENDER_EMAIL:
    SENDER_EMAIL = SMTP_USER

@app.route('/api/send_email', methods=['POST'])
def send_currency_email():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    recipient_email = data.get('to')
    currencies = data.get('currencies', [])

    if not recipient_email or recipient_email.strip() == '':
        return jsonify({"status": "error", "message": "Email address is missing!"}), 400

    if not currencies:
        return jsonify({"status": "error", "message": "No currencies selected!"}), 400

    table_rows = ""
    for curr in currencies:
        code = curr.get('code', 'N/A')
        name = curr.get('name', 'Валюта')
        rate = curr.get('rate', '0.00')
        trend = curr.get('trend', 'up')

        if trend == 'up':
            trend_display = '<span style="color: #2e7d32; font-weight: bold;">☀️ Растет</span>'
            row_bg = "#f0fff4"
        else:
            trend_display = '<span style="color: #d32f2f; font-weight: bold;">🌧️ Падает</span>'
            row_bg = "#fff5f5"

        table_rows += f"""
        <tr style="background-color: {row_bg}; border-bottom: 1px solid #dddddd;">
            <td style="padding: 12px; border: 1px solid #dddddd; text-align: center; font-weight: bold;">{code}</td>
            <td style="padding: 12px; border: 1px solid #dddddd;">{name}</td>
            <td style="padding: 12px; border: 1px solid #dddddd; text-align: right; font-weight: bold;">{rate}</td>
            <td style="padding: 12px; border: 1px solid #dddddd; text-align: center;">{trend_display}</td>
        </tr>
        """

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-top: 0;">
                📊 Сводный отчет по курсам валют
            </h2>
            <p style="font-size: 15px; color: #333333; line-height: 1.5;">
                Здравствуйте! Вы получили этот отчет, так как запросили выгрузку закрепленных валютных виджетов в приложении <b>CurrWeather</b>.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <thead>
                  <tr style="background-color: #007bff; color: #ffffff;">
                    <th style="padding: 12px; border: 1px solid #dddddd;">Код</th>
                    <th style="padding: 12px; border: 1px solid #dddddd; text-align: left;">Название</th>
                    <th style="padding: 12px; border: 1px solid #dddddd; text-align: right;">Курс</th>
                    <th style="padding: 12px; border: 1px solid #dddddd;">Тренд</th>
                  </tr>
                </thead>
                <tbody>
                    {table_rows}
                </tbody>
            </table>
            
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777;">
                <p style="margin: 0;">Это автоматическое уведомление. Отвечать на него не нужно.</p>
                <p style="margin: 5px 0 0 0;">© CurrWeather Currency App</p>
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Отчет по курсам валют - CurrWeather"
    # Заставляем заголовок From СТРОГО совпадать с логином авторизованного пользователя
    msg['From'] = SMTP_USER 
    msg['To'] = recipient_email
    
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    try:
        # Подключаемся по SSL (порт 465)
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SMTP_USER, SMTP_PASSWORD)
        all_recipients = [recipient_email]
        server.sendmail(msg['From'], all_recipients, msg.as_string())
        server.quit()
        return jsonify({"status": "success", "message": "Email sent successfully"}), 200
    except Exception as e:
        print(f"SMTP Error for user {SMTP_USER}: {str(e)}") 
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)