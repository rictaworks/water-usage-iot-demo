Rails.application.routes.draw do
  namespace :api do
    get  'session',           to: 'sessions#show'
    post 'devices',           to: 'devices#create'
    put  'devices/:id/pump',  to: 'devices#pump'
    post 'readings',          to: 'readings#create'
    get  'stream',            to: 'streams#show'
    get  'simulator/status',  to: 'simulator#status'
    post 'simulator/start',   to: 'simulator#start'
    post 'simulator/stop',    to: 'simulator#stop'
    post 'admin/daily-reset', to: 'admin#daily_reset'
  end
end
