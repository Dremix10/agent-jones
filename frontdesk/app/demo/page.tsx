'use client';

import { useState } from 'react';
import { Card, CardTitle, PrimaryButton } from '../../components/ui';
import { createLead, sendMessage, downloadIcs, ApiReply } from '../../lib/mockApi';

// Toggle this to use mock API vs real endpoints
const USE_MOCK = true;

type Scenario = {
  emoji: string;
  label: string;
  data: {
    name: string;
    phone: string;
    zip: string;
    service: string;
    vehicleType: string;
    timeWindow: string;
    firstMessage: string;
  };
};

const SCENARIOS: Scenario[] = [
  {
    emoji: '🏎️',
    label: 'Simple wash in 77005',
    data: {
      name: 'Alex',
      phone: '346-555-0101',
      zip: '77005',
      service: 'Exterior wash',
      vehicleType: 'sedan',
      timeWindow: 'this Friday morning',
      firstMessage: 'Hi—need an exterior wash near Rice Village this Friday. Price?'
    }
  },
  {
    emoji: '🚚',
    label: 'Large truck – out of area',
    data: {
      name: 'Jordan',
      phone: '832-555-0123',
      zip: '77380',
      service: 'Full detail',
      vehicleType: 'F-250',
      timeWindow: 'this weekend',
      firstMessage: 'Full detail for an F-250 in The Woodlands.'
    }
  },
  {
    emoji: '🐶',
    label: 'Weird / ambiguous request',
    data: {
      name: 'Sam',
      phone: '713-555-0199',
      zip: '77006',
      service: 'Other',
      vehicleType: 'SUV',
      timeWindow: 'next week',
      firstMessage: 'Can you do pet hair extraction and ozone?'
    }
  }
];

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  slotOptions?: { start: string; end: string }[];
  booking?: { title: string; start: string; end: string; icsUrl?: string };
};

export default function DemoPage() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zip: '',
    service: 'Exterior wash',
    vehicleType: '',
    timeWindow: '',
    firstMessage: ''
  });

  // Chat state
  const [leadId, setLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<{ title: string; start: string; end: string; icsUrl?: string } | null>(null);

  const handleScenarioClick = (scenario: Scenario) => {
    setFormData(scenario.data);
    // Reset chat state
    setLeadId(null);
    setMessages([]);
    setInputText('');
    setCurrentBooking(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartChat = async () => {
    if (!formData.name || !formData.phone || !formData.zip || !formData.firstMessage) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      let id: string;

      if (USE_MOCK) {
        const result = await createLead(formData);
        id = result.id;
      } else {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        id = data.id;
      }

      setLeadId(id);

      // Add the first user message
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        text: formData.firstMessage,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([userMessage]);

      // Get AI response
      await sendUserMessage(id, formData.firstMessage, [userMessage]);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendUserMessage = async (id: string, text: string, existingMessages: Message[]) => {
    setIsLoading(true);

    try {
      let apiReply: ApiReply;

      if (USE_MOCK) {
        apiReply = await sendMessage(id, { text });
      } else {
        const response = await fetch(`/api/leads/${id}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        apiReply = await response.json();
      }

      // Add AI response
      const aiMessage: Message = {
        id: `msg_${Date.now()}`,
        text: apiReply.reply,
        sender: 'ai',
        timestamp: new Date(),
        slotOptions: apiReply.slotOptions,
        booking: apiReply.booking
      };

      setMessages([...existingMessages, aiMessage]);

      // Update booking if confirmed
      if (apiReply.booking) {
        setCurrentBooking(apiReply.booking);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !leadId || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');

    await sendUserMessage(leadId, inputText, updatedMessages);
  };

  const handleSlotSelection = async (index: number) => {
    if (!leadId) return;

    const slotText = `I'll take option ${index + 1}`;
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: slotText,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    await sendUserMessage(leadId, slotText, updatedMessages);
  };

  const handleDownloadIcs = () => {
    if (!currentBooking) return;

    const blob = downloadIcs(currentBooking);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'appointment.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      zip: '',
      service: 'Exterior wash',
      vehicleType: '',
      timeWindow: '',
      firstMessage: ''
    });
    setLeadId(null);
    setMessages([]);
    setInputText('');
    setCurrentBooking(null);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatSlotTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Agent Jones Demo</h1>
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Reset demo
          </button>
        </div>

        {/* Scenario Selector */}
        <Card className="mb-6">
          <CardTitle className="mb-4">Choose a Scenario</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SCENARIOS.map((scenario, index) => (
              <button
                key={index}
                onClick={() => handleScenarioClick(scenario)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">{scenario.emoji}</div>
                <div className="text-sm font-medium text-gray-900">{scenario.label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Lead Form */}
        <Card className="mb-6">
          <CardTitle className="mb-4">Lead Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXX-XXX-XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code *
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="77005"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                value={formData.service}
                onChange={(e) => handleInputChange('service', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Exterior wash">Exterior wash</option>
                <option value="Full detail">Full detail</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <input
                type="text"
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sedan, SUV, truck..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time Window
              </label>
              <input
                type="text"
                value={formData.timeWindow}
                onChange={(e) => handleInputChange('timeWindow', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="this Friday morning"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Message *
            </label>
            <textarea
              value={formData.firstMessage}
              onChange={(e) => handleInputChange('firstMessage', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer's initial inquiry..."
            />
          </div>

          <PrimaryButton onClick={handleStartChat} className="w-full md:w-auto">
            {isLoading && !leadId ? 'Starting...' : 'Start Chat'}
          </PrimaryButton>
        </Card>

        {/* Chat UI */}
        {leadId && (
          <Card>
            <CardTitle className="mb-4">Chat</CardTitle>

            {/* Booking Confirmation Card */}
            {currentBooking && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="font-semibold text-green-900 mb-2">Booked!</div>
                <div className="text-sm text-green-800 mb-1">
                  <strong>{currentBooking.title}</strong>
                </div>
                <div className="text-sm text-green-700 mb-3">
                  {formatSlotTime(currentBooking.start)} - {formatSlotTime(currentBooking.end)}
                </div>
                {currentBooking.icsUrl && (
                  <button
                    onClick={handleDownloadIcs}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download .ics
                  </button>
                )}
              </div>
            )}

            {/* Message List */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{message.text}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Slot Options */}
                  {message.slotOptions && message.slotOptions.length > 0 && (
                    <div className="mt-2 ml-4 space-y-2">
                      {message.slotOptions.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => handleSlotSelection(index)}
                          className="block w-full md:w-auto px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          Option {index + 1}: {formatSlotTime(slot.start)} - {formatSlotTime(slot.end)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Spinner */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Type your message..."
              />
              <PrimaryButton onClick={handleSendMessage} className={isLoading ? 'opacity-50' : ''}>
                Send
              </PrimaryButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
