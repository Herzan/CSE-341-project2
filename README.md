# CSE-341-project2


# Book Library API

Base URL: /api/books

## GET /api/books
- Description: Get all books
- Response: 200 - array of books

## GET /api/books/:id
- Description: Get single book
- Response: 200 - book object | 404 - not found

## POST /api/books
- Body: { title*, author*, isbn?, genre?, publicationYear?, ... }
- Response: 201 - created book | 400 - validation error

## PUT /api/books/:id
- Body: fields to update
- Response: 200 - updated book | 404 - not found

## DELETE /api/books/:id
- Response: 200 - deleted message | 404 - not found