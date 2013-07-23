csv = open(ARGV[0])

data = []
popKey1 = popKey2 = ""

csv.readlines.each do |line|
  state, pop1, pop2, change = line.split(',').map(&:chomp)

  if state == 'Name'
    popKey1 = "pop#{pop1}"
    popKey2 = "pop#{pop2}"
  else
    data << {"state" => state, popKey1 => pop1, popKey2 => pop2, "change" => change}
  end
end

puts data.to_s.gsub("=>", ":")