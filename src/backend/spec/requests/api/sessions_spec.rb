require 'rails_helper'

RSpec.describe 'GET /api/session', type: :request do
  it 'creates a new session and returns session_id' do
    get '/api/session'
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json['session_id']).to be_present
    expect(json['facility_mode']).to eq(false)
  end

  it 'returns existing session when cookie is present' do
    get '/api/session'
    session_id = JSON.parse(response.body)['session_id']

    get '/api/session'
    json = JSON.parse(response.body)
    expect(json['session_id']).to eq(session_id)
  end
end
