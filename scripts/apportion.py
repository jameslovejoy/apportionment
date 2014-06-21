import math

class Apportion:
	populations = {}
	seats = {}

	def __init__(self):
		f = open('../data/2010.csv', 'r')
		for line in f:
			state, pop = [s.strip() for s in line.split(',')]

			self.seats[state] = 1
			self.populations[state] = int(pop.strip())

	@classmethod
	def find_highest_priority(cls):
		highest = 0
		highest_state = None

		for state in cls.populations:
			n = cls.seats[state]
			priority = cls.populations[state] / math.sqrt(n*(n+1))

			if priority > highest:
				highest = priority
				highest_state = state

		return highest_state

	@classmethod
	def run(cls):
		# 435 seats: Every state gets 1 to start, leaving 385 left to apportion.
		for n in range(385):
			state = cls.find_highest_priority()
			cls.seats[state] += 1

			seat_number = 51 + n
			print "Assigning Seat {} to {}".format(seat_number, state)

		print "Just missed the cut..."
		state = cls.find_highest_priority()
		print "Seat 436 would be assigned to {}".format(state)

		for state in sorted(cls.seats):
			print("{}\t{}").format(state.rjust(20), str(cls.seats[state]).rjust(3))

Apportion().run()