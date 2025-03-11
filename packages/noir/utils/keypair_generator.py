import random, math, json, sys

λ = int(sys.argv[1])
log_λ = math.log2(λ)
#assert(log_λ % 1 == 0)
log_λ = int(log_λ)

ρ = λ
η = λ*log_λ
γ = η + (λ+log_λ)
τ = γ + 2*λ + 2

# Random sample of b bits
def uniform(b):
    return random.randint(2**(b-1), (2**b)-1)

# To representated BigNum
def to_limbs(n):
    limbs = []
    while n >= 2**120:
        limbs.append(hex(n % 2**120))
        n = n // 2**120
    limbs.append(hex(n))
    return limbs

# Generate needed samples
p = uniform(η)
qs = [uniform(γ-η) for _ in range(τ+1)]
rs = [uniform(ρ) for _ in range(τ+1)]
xs = [p*qs[i]+rs[i]-(2**(ρ-1)) for i in range(τ+1)]

# Reorder greatest to x_0
i = xs.index(max(xs))
qs.insert(0,qs.pop(i))
rs.insert(0,rs.pop(i))
xs.insert(0,xs.pop(i))

# Reorder an odd q to x_1
while qs[1] % 2 == 0:
    qs.append(qs.pop(1))
    rs.append(rs.pop(1))
    xs.append(xs.pop(1))

# Output numbers to files
print(τ, file=open('tau', 'w'))
print(λ, file=open('lambda', 'w'))
print(xs[0], file=open('modulus', 'w'))
print(json.dumps(to_limbs(p)), file=open('decryption_key', 'w'))
print(json.dumps(list(map(to_limbs, qs))), file=open('scaling_factors', 'w'))
print(json.dumps(list(map(to_limbs, rs))), file=open('additive_noises', 'w'))
print(json.dumps(list(map(to_limbs, xs))), file=open('encryption_key', 'w'))
