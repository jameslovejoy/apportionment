require 'csv'
require 'open-uri'

if ARGV.size < 1
  $stderr.puts "Usage: #{$0} census.csv"
  $stderr.puts "\nExample: #{$0} http://www.census.gov/popest/data/national/totals/2013/files/NST-EST2013-popchg2010_2013.csv"

  exit
end

# Read and parse the CSV using the column headers as keys
csv = CSV.parse(open(ARGV[0]).read)
headers = csv.shift#.map(&:to_s)
data = csv.map {|row| Hash[*headers.zip(row).flatten] }

# Find all calculations to perform, such as:
#   2010 => [2011, 2012, 2013]
#   2011 => [2012, 2013]
#   ...
base_year = headers.grep(/ESTIMATESBASE(.*)/).first.scan(/\d+/).first
estimate_years = headers.grep(/POPESTIMATE(.*)/).map {|match| match.scan(/\d+/).first}.delete_if {|year| year == base_year}

calculations = {base_year => []}
estimate_years.each do |estimate_year|
  calculations[base_year] << estimate_year
  calculations[estimate_year] = estimate_years.dup.keep_if {|year| year > estimate_year}
end

# Read in the population data
states = []
data.each do |region|
  state_name = region['NAME']
  next if ['Northeast Region', 'Midwest Region', 'South Region', 'West Region', 'District of Columbia', 'Puerto Rico'].include?(state_name)

  state = {'name' => state_name}
  state[base_year] = region["ESTIMATESBASE#{base_year}"]
  estimate_years.each do |year|
    state[year] = region["POPESTIMATE#{year}"]
  end

  states << state
end

# Perform percentage population calculations and projections
calculations.each do |initial_year, estimate_years|
  estimate_years.each do |estimate_year|
    data_to_write = []

    states.each do |state|
      percent_change = (state[estimate_year].to_i-state[initial_year].to_i)/state[initial_year].to_f

      months_since_base = (estimate_year.to_i - initial_year.to_i) * 12
      months_since_base += 3 if initial_year == base_year # Base is from April 1; Estimates are from July 1, hence the extra 3 months

      # Extrapolate the percentage change over entire decade
      months_for_extrapolation = 120
      projected_change = (1.0 + percent_change) ** (months_for_extrapolation/months_since_base.to_f) - 1.0
      note = "#{(percent_change*100.0).round(2)}% growth over #{months_since_base} months = #{(projected_change*100.0).round(2)}% growth over #{months_for_extrapolation} months"

      # Gather information to output
      data_to_write << {
        "state"               => state['name'],
        "pop#{base_year}"     => state[base_year],
        "pop#{initial_year}"  => state[initial_year],
        "pop#{estimate_year}" => state[estimate_year],
        "estimate"            => {"start"  => {"population" => state[initial_year], "year" => initial_year},
                                  "finish" => {"population" => state[estimate_year], "year" => estimate_year}},
        "change"              => projected_change,
        "note"                => note
      }
    end

    # Write data as JSON
    File.open("../data/population-#{initial_year}-#{estimate_year}.json", "w+") do |file|
      file.write data_to_write.to_s.gsub("=>", ":")
    end
  end
end