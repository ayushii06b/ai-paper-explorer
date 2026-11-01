import sys
import io
from pathlib import Path

# Ensure UTF-8 output formatting on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.rag import generate_rag_answer


def run_tests():
    test_questions = [
        "What are the challenges of retrieval augmented generation?",
        "How are large language models evaluated?",
        "What methods are used for training neural networks?",
        "How are vision transformers used in computer vision?",
        "What is the recipe for baking authentic sourdough bread?" # Unrelated question
    ]

    print("=" * 80, flush=True)
    print("AI RESEARCH PAPER EXPLORER - RAG PIPELINE TEST SUITE", flush=True)
    print("=" * 80, flush=True)

    for idx, q in enumerate(test_questions, start=1):
        print(f"\n[{idx}/{len(test_questions)}] QUESTION:", flush=True)
        print(q, flush=True)
        print("-" * 80, flush=True)

        result = generate_rag_answer(q, top_k=3)

        print("ANSWER:", flush=True)
        print(result["answer"], flush=True)
        print("\nSOURCES:", flush=True)
        if not result["sources"]:
            print("  (No sources returned)", flush=True)
        else:
            for s in result["sources"]:
                print(f"  - PAPER: {s['paper']} | PAGE: {s['page']} | SIMILARITY: {s['similarity']:.4f}", flush=True)

        print("=" * 80, flush=True)


if __name__ == "__main__":
    run_tests()
