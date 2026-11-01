import sys
import io

# Ensure UTF-8 output formatting on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from src.retrieval import search_similar_chunks


queries = [
    "What are the recent advances in large language models?",
    "How are vision transformers used in computer vision?",
    "What methods are used for training neural networks?",
    "What are the challenges of retrieval augmented generation?",
    "How are large language models evaluated?"
]


for query in queries:

    print("\n" + "=" * 70)
    print("QUERY:", query)
    print("=" * 70)

    results = search_similar_chunks(
        query,
        top_k=3
    )

    for i, result in enumerate(results, start=1):

        print(f"\nRESULT {i}")
        print("Paper:", result["title"])
        print("Page:", result["page"])
        print("Similarity:", f"{result['similarity']:.4f}")

        print("\nText:")
        print(result["text"][:700])

        print("-" * 70)
