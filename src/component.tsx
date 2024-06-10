import type { FC } from 'hono/jsx'

type SearchResult = {
  id: number;
  title: string;
  similarity?: number;
}

export const Layout: FC = (props) => (
  <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://cdn.tailwindcss.com" />
      <title>Yum Yum Recipes dot com</title>
    </head>
    <body>
      <div class="p-4">
        {props.children}
      </div>
    </body>
  </html>
)

export const SearchForm = ({ similarity, query }: { query?: string; similarity?: number }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-semibold mb-4">Search</h2>

    <form method="get" action="/recipes/search" className="flex items-center space-x-4">
      <label htmlFor="similarity" className="text-lg font-medium">Similarity:</label>
      <input
        type="number"
        id="similarity"
        name="similarity"
        min="0"
        max="1"
        step="0.1"
        className="w-20 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 text-mono"
        defaultValue="0.4"
        value={similarity}
      />
      <input
        type="text"
        name="query"
        className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        placeholder="Enter your query"
        value={query}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
      >
        Search
      </button>
    </form>
  </div>
)

export const SearchResults = ({ results }: { results: SearchResult[] }) => {
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div key={result.id} className="flex flex-col p-3 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 flex flex-col lg:flex-row lg:item-center">
            {result.title}
            <div className="text-mono text-xs font-medium ml-auto">{result.similarity ?? ""}</div>
          </h2>
        </div>
      ))}
    </div>
  )
}