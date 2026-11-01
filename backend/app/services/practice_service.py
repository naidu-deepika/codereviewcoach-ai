"""Practice exercises.

The exercises are written by hand (not generated), so every hint and solution has been
checked by a person. They are matched to the mistakes that the student's own saved
reviews found most often. Nothing here runs the student's code.
"""
from sqlalchemy.orm import Session

from app.db.models import User
from app.services.stats_service import dashboard_stats

# Keys are the finding messages produced by the static analyzer.
BY_MISTAKE = {
    "Mutable default argument": {
        "id": "mutable-default",
        "title": "Fix the shared list",
        "prompt": "This function should return a NEW list each time, but calls keep adding to the same list. "
        "Rewrite it so add_item('a') followed by add_item('b') returns ['b'].\n\n"
        "def add_item(item, items=[]):\n    items.append(item)\n    return items",
        "hint": "A default value is created once, when the function is defined. Use None as the default instead.",
        "solution": "def add_item(item, items=None):\n    if items is None:\n        items = []\n    items.append(item)\n    return items",
    },
    "Bare except clause": {
        "id": "bare-except",
        "title": "Catch only what you expect",
        "prompt": "This code hides every error, even typos. Change it so it only handles a missing key.\n\n"
        "try:\n    price = data['price']\nexcept:\n    price = 0",
        "hint": "Name the error after except. A missing dictionary key raises KeyError.",
        "solution": "try:\n    price = data['price']\nexcept KeyError:\n    price = 0",
    },
    "Use of eval()": {
        "id": "eval",
        "title": "Stop running text as code",
        "prompt": "A user types a list like \"[1, 2, 3]\" and the program turns it into a list with eval(). "
        "Replace eval() with a safe alternative.\n\nvalues = eval(user_text)",
        "hint": "The ast module has a function that reads only plain Python values such as lists and numbers.",
        "solution": "import ast\n\nvalues = ast.literal_eval(user_text)",
    },
    "Comparison to None with ==": {
        "id": "none-comparison",
        "title": "Check for None the Python way",
        "prompt": "Rewrite both checks in the usual Python style.\n\n"
        "if result == None:\n    print('missing')\nif name != None:\n    print(name)",
        "hint": "None is a single object, so compare identity, not equality.",
        "solution": "if result is None:\n    print('missing')\nif name is not None:\n    print(name)",
    },
    "Possible division by zero": {
        "id": "division-by-zero",
        "title": "Guard the empty list",
        "prompt": "average([]) crashes. Make it return 0 for an empty list.\n\n"
        "def average(numbers):\n    return sum(numbers) / len(numbers)",
        "hint": "Check whether the list is empty before dividing.",
        "solution": "def average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)",
    },
}

STARTERS = [
    {
        "id": "starter-largest",
        "title": "Largest number without max()",
        "prompt": "Write largest(numbers) that returns the biggest number in a list using a loop. "
        "Return None for an empty list.",
        "hint": "Start with the first item and compare each other item to it.",
        "solution": "def largest(numbers):\n    if not numbers:\n        return None\n    best = numbers[0]\n    for n in numbers[1:]:\n        if n > best:\n            best = n\n    return best",
    },
    {
        "id": "starter-vowels",
        "title": "Count the vowels",
        "prompt": "Write count_vowels(text) that counts a, e, i, o, u in a string, ignoring capital letters.",
        "hint": "Turn the text to lower case first, then check if each letter is in 'aeiou'.",
        "solution": "def count_vowels(text):\n    return sum(1 for ch in text.lower() if ch in 'aeiou')",
    },
    {
        "id": "starter-file",
        "title": "Read a file safely",
        "prompt": "Write read_lines(path) that returns the lines of a text file and closes the file properly, "
        "even if an error happens.",
        "hint": "Use a with block.",
        "solution": "def read_lines(path):\n    with open(path, encoding='utf-8') as f:\n        return f.read().splitlines()",
    },
]


def practice_for(db: Session, user: User, limit: int = 5) -> dict:
    top = dashboard_stats(db, user)["common_mistakes"]
    exercises, based_on = [], []
    for mistake in top:
        item = BY_MISTAKE.get(mistake["message"])
        if item and len(exercises) < limit:
            exercises.append({**item, "reason": f'You hit "{mistake["message"]}" {mistake["count"]} time(s).'})
            based_on.append(mistake["message"])
    for starter in STARTERS:
        if len(exercises) >= 3:
            break
        exercises.append({**starter, "reason": "A warm-up exercise."})
    return {"exercises": exercises, "based_on": based_on}
