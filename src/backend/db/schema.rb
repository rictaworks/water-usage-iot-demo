# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_24_164921) do
  create_table "alerts", id: :string, force: :cascade do |t|
    t.datetime "created_at"
    t.string "device_id"
    t.string "message"
    t.string "rule_id"
    t.string "severity"
    t.index ["device_id"], name: "index_alerts_on_device_id"
  end

  create_table "daily_summaries", id: :string, force: :cascade do |t|
    t.date "date_jst"
    t.string "device_id"
    t.float "total_liters", default: 0.0
    t.datetime "updated_at"
    t.index ["device_id"], name: "index_daily_summaries_on_device_id", unique: true
  end

  create_table "devices", id: :string, force: :cascade do |t|
    t.datetime "created_at"
    t.string "device_token"
    t.boolean "is_virtual", default: false
    t.string "label"
    t.datetime "online_at"
    t.string "session_id"
    t.index ["device_token"], name: "index_devices_on_device_token", unique: true
    t.index ["session_id"], name: "index_devices_on_session_id"
  end

  create_table "flow_readings", id: :string, force: :cascade do |t|
    t.string "device_id"
    t.float "flow_rate"
    t.datetime "received_at"
    t.integer "received_at_sec"
    t.float "volume_delta"
    t.index ["device_id", "received_at_sec"], name: "index_flow_readings_on_device_id_and_received_at_sec", unique: true
    t.index ["device_id"], name: "index_flow_readings_on_device_id"
  end

  create_table "scenario_presets", force: :cascade do |t|
    t.string "description"
    t.string "name"
    t.text "pattern_json"
  end

  create_table "sessions", id: :string, force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "expires_at"
    t.boolean "facility_mode", default: false
  end
end
