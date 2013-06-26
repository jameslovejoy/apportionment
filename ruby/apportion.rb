class Apportion

  attr_accessor :population
  attr_accessor :seats

  def initialize
    @population = {}
    @seats = {}

    File.readlines("../data/2010.csv").each do |line|
      state, pop = line.split(',').map(&:chomp)
      
      @seats[state] = 1
      @population[state] = pop.to_i
    end
  end

  def find_highest_priority
    highest = 0
    highest_state = nil

    @population.each do |state, pop|
      n =  @seats[state]
      priority = pop / Math.sqrt(n*(n+1))

      if priority > highest
        highest = priority
        highest_state = state
      end
    end

    return highest_state
  end

  def apportion
    385.times do |n|
      state = find_highest_priority
      @seats[state] += 1

      seat_number = 51 + n
      puts "Assigning Seat #{seat_number} to #{state}"
    end

    puts "Just missed the cut..."
    state = find_highest_priority
    puts "Seat 436 would be assigned to #{state}"

    @seats.each do |state, seats|
      printf("%20s\t%3d\n", state, seats)
    end
  end
end

Apportion.new.apportion