# Copyright 2013-14
#
# Author: James Lovejoy
# License: MIT
#
require 'csv'
require 'json'

if ARGV.size < 1
  $stderr.puts "Usage: #{$0} [population.json]"
  $stderr.puts "\nExample: #{$0} data/population-2010-2013.json"

  exit
end

data = JSON.parse(open(ARGV[0]).read)
data.each do |datum|
  state = datum['state']
  next if state == 'United States'

  population2010 = datum['pop2010'].to_i
  percentage = datum['change']
  population2020 = ((population2010 * percentage) + population2010).round

  puts "#{state},#{population2020}"
end