require 'rails_helper'

RSpec.describe 'POST /api/readings', type: :request do
  let!(:session) { Session.create! }
  let!(:device) { session.devices.create!(device_token: 'READDEV', label: 'Test') }

  it 'creates a reading and returns led_state' do
    post '/api/readings', params: {
      device_token: 'READDEV',
      flow_rate: 2.5,
      volume_delta: 0.2,
      sent_at_sec: Time.current.to_i
    }
    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json['reading_id']).to be_present
    expect(json['led_state']['led_color']).to be_present
  end

  it 'handles duplicate sent_at_sec idempotently' do
    ts = Time.current.to_i
    params = { device_token: 'READDEV', flow_rate: 1.0, volume_delta: 0.1, sent_at_sec: ts }

    post '/api/readings', params: params
    expect(response).to have_http_status(:created)

    post '/api/readings', params: params
    json = JSON.parse(response.body)
    expect(json['skipped']).to eq(true)
  end

  it 'rejects unknown device_token' do
    post '/api/readings', params: { device_token: 'UNKNOWN', flow_rate: 1.0, sent_at_sec: Time.current.to_i }
    expect(response).to have_http_status(:not_found)
  end
end
