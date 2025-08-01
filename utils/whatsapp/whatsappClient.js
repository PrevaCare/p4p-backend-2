// File: whatsapp/whatsappClient.js
const axios = require('axios');

class WhatsAppClient {
  constructor() {
    const apiKey = process.env.GUPSHUP_API_KEY;
    if (!apiKey) throw new Error('Gupshup API key is required');
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.gupshup.io/wa/api/v1',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: this.apiKey,
      },
    });
  }

  async sendTextMessage({ sender, recipient, message }) {
    const payload = new URLSearchParams({
      channel: 'whatsapp',
      source: sender,
      destination: recipient,
      message,
      'src.name': sender,
    });
    const response = await this.client.post('/msg', payload);
    return response.data;
  }

  async sendMediaMessage({ sender, recipient, mediaUrl, mediaType, caption }) {
    const payload = new URLSearchParams({
      channel: 'whatsapp',
      source: sender,
      destination: recipient,
      'media': mediaUrl,
      'type': mediaType,
      'src.name': sender,
    });
    if (caption) payload.append('caption', caption);
    const response = await this.client.post('/msg', payload);
    return response.data;
  }
}

module.exports = WhatsAppClient;
