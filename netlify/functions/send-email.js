exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, text, html } = JSON.parse(event.body);

    // Use Brevo API to send email
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM || 'samarthlodging89@gmail.com',
          name: 'Samarth Lodging'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        textContent: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email sent successfully',
        messageId: data.messageId
      })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error sending email',
        error: error.message
      })
    };
  }
};
