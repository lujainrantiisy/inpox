# Routing Categories

## support
**Definition:** The customer already has an order, product, or account and needs help with it, or something is broken.

**Examples:**
- "my order hasn't arrived"
- "the app keeps crashing"
- "I was charged twice"
- "طلبي تأخر"

**NOT support:** someone asking about buying for the first time (that's sales).

## sales
**Definition:** Someone who has not bought yet and is asking questions to decide (plans, features, pricing, availability).

**Examples:**
- "do you have a team plan?"
- "can I get a discount for 10 seats?"
- "what's the difference between your plans?"
- "بدي أعرف أسعار الباقات"

**NOT sales:** someone who already bought and has a problem (that's support).

## other
**Definition:** Anything that fits neither category, gibberish, or when the router is unsure.

**Examples:**
- "asldkj"
- "hello"
- "what's the weather?"

**Behavior:** goes to the Fallback, which replies and sets needs_human = true.