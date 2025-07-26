banned_words = {
    "lazy": "struggling",
    "disgusting": "overwhelmed"
}

def sanitize_text(text):
    for word, alt in banned_words.items():
        text = text.replace(word, alt)
    return text

class Forum:
    def __init__(self):
        self.posts = []

    def submit_post(self, content):
        content = sanitize_text(content)
        post = {
            'id': len(self.posts),
            'content': content,
            'stars': 0,
            'bookmarked': False,
            'comments': []
        }
        self.posts.append(post)
        return post

    def star_post(self, post_id):
        if 0 <= post_id < len(self.posts):
            self.posts[post_id]['stars'] += 1

    def bookmark_post(self, post_id):
        if 0 <= post_id < len(self.posts):
            self.posts[post_id]['bookmarked'] = True

    def add_comment(self, post_id, comment):
        if 0 <= post_id < len(self.posts):
            sanitized = sanitize_text(comment)
            self.posts[post_id]['comments'].append(sanitized)

    def get_all_posts(self):
        return self.posts
