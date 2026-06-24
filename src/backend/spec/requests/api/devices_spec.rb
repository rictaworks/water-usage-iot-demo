require 'rails_helper'

RSpec.describe 'POST /api/devices', type: :request do
  let!(:session) { Session.create! }

  before do
    cookies[:session_id] = session.id
  end

  it 'creates a device successfully' do
    post '/api/devices', params: { device_token: 'TOKEN123', label: 'Kitchen' }
    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json['device_id']).to be_present
    expect(json['label']).to eq('Kitchen')
  end

  it 'rejects request when honeypot is triggered' do
    post '/api/devices', params: { device_token: 'TOKEN456', label: 'Bath', hp_field: 'bot' }
    expect(response).to have_http_status(:forbidden)
  end

  it 'rejects duplicate device_token' do
    post '/api/devices', params: { device_token: 'DUPTOKEN', label: 'A' }
    post '/api/devices', params: { device_token: 'DUPTOKEN', label: 'B' }
    expect(response).to have_http_status(:unprocessable_entity)
  end
end
