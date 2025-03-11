import random, sys

entropy = [random.choice([0,1]) for _ in range(int(sys.argv[1]))]

print(entropy, file=open('entropy', 'w'));
