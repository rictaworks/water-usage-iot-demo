Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:3000', 'https://*.vercel.app', 'https://water-usage-iot-demo.rictaworks.jp'
    resource '*', headers: :any, methods: [:get, :post, :options], credentials: true
  end
end
