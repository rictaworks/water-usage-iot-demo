class CreateScenarioPresets < ActiveRecord::Migration[8.1]
  def change
    create_table :scenario_presets do |t|
      t.string :name
      t.string :description
      t.text :pattern_json
    end
  end
end
