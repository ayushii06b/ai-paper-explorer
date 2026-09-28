export const MOCK_PAPERS = [
  {
    id: "bge-v1-5",
    title: "BAAI/bge-base-en-v1.5: Dense Embeddings for High-Efficiency Retrieval",
    authors: "Shitao Xiao, Zheng Liu, Peitian Zhang, Niklas Muennighoff",
    year: 2023,
    category: "Natural Language Processing",
    pages: 12,
    pdfPath: "Data/sample paper.pdf",
    abstract: "Dense text embeddings play a critical role in modern retrieval-augmented generation (RAG) and semantic search systems. We introduce BAAI/bge-base-en-v1.5, an open-source encoder model optimized for 768-dimensional vector representations. By combining retroactive fine-tuning, contrastive pre-training, and multi-stage instruction tuning, BGE-base-en-v1.5 achieves state-of-the-art performance across the MTEB (Massive Text Embedding Benchmark) retrieval leaderboard while maintaining lightweight inference footprint suitable for real-time production deployment.",
    overview: "BGE (Beijing Academy of Artificial Intelligence General Embedding) v1.5 establishes a new benchmark for open-source dense vector representation. It outputs 768-dimensional normalized dense vectors designed specifically for vector database similarity search, document chunk indexing, and RAG pipelines.",
    keyInformation: [
      { label: "Vector Dimension", value: "768 float32 values" },
      { label: "Max Sequence Length", value: "512 tokens" },
      { label: "Base Architecture", value: "BERT-base transformer encoder" },
      { label: "Primary Use Case", value: "Dense retrieval & semantic paper search" },
      { label: "License", value: "MIT License" }
    ],
    researchProblem: "Traditional lexical search systems (e.g. BM25) struggle with synonymy, paraphrase resolution, and semantic intent matching in dense technical domains like scientific literature retrieval. Early dense encoders suffered from high dimensional overhead or degraded retrieval accuracy on out-of-domain queries.",
    method: "BGE v1.5 utilizes a 3-stage training methodology: (1) Unsupervised pre-training on 100M+ web text pairs using contrastive loss; (2) Supervised fine-tuning with hard negative sampling from multiple retrieval datasets; (3) Instruction tuning with normalized cosine similarity constraints.",
    results: "On the MTEB benchmark, BAAI/bge-base-en-v1.5 achieves an average retrieval score of 64.1%, outperforming OpenAI text-embedding-ada-002 and existing 768-dim models while maintaining fast sub-10ms query encoding times on standard GPU hardware.",
    sampleQuestions: [
      "What is the embedding dimension of BGE v1.5?",
      "How does BGE handle hard negative sampling during training?",
      "What benchmark was used to evaluate retrieval accuracy?"
    ],
    qaHistory: [
      {
        id: "qa-1",
        question: "What is the vector dimension and max sequence length for BAAI/bge-base-en-v1.5?",
        answer: "BAAI/bge-base-en-v1.5 generates dense normalized embeddings with a dimension of 768 float32 values. It supports a maximum sequence length of 512 tokens per document chunk during encoding.",
        sources: [
          {
            page: 2,
            chunk: 4,
            text: "The model maps input text chunks into a 768-dimensional continuous vector space with L2 normalization. Sequence truncation occurs at 512 tokens."
          },
          {
            page: 4,
            chunk: 9,
            text: "For paper chunking, paragraph boundaries are preserved while verifying token count stays under 500 tokens to prevent sequence clipping."
          }
        ]
      },
      {
        id: "qa-2",
        question: "How does BGE v1.5 compare with lexical search models like BM25?",
        answer: "BGE v1.5 captures semantic meaning beyond keyword overlap. On MTEB retrieval tasks, BGE v1.5 achieves a 64.1% average score compared to BM25's 42.5%, excelling at paraphrased queries and conceptual scientific questions.",
        sources: [
          {
            page: 7,
            chunk: 18,
            text: "Lexical methods fail when domain terminology differs from query vocabulary. Dense embeddings compute cosine similarity in vector space, resolving semantic equivalents."
          }
        ]
      }
    ]
  },
  {
    id: "rag-paper-2020",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    authors: "Patrick Lewis, Ethan Perez, Aleksandros Piktus, Fabio Petroni, Vladimir Karpukhin",
    year: 2020,
    category: "Information Retrieval & RAG",
    pages: 16,
    pdfPath: "Data/rag_paper.pdf",
    abstract: "Large pre-trained language models store factual knowledge in their parameters, but their ability to access and precisely manipulate knowledge is limited. We explore Retrieval-Augmented Generation (RAG) models which combine non-parametric memory (a vector database of Wikipedia documents) with a parametric seq2seq model.",
    overview: "RAG models combine parametric memory (a pre-trained seq2seq transformer like BART) with non-parametric memory (a dense vector index of text chunks accessed via MIPS). By conditioning generation on retrieved documents, RAG reduces hallucinations and allows dynamic knowledge updates.",
    keyInformation: [
      { label: "Retriever Type", value: "Dense Passage Retriever (DPR)" },
      { label: "Generator Type", value: "BART-large" },
      { label: "Index Mechanism", value: "FAISS / pgvector MIPS" },
      { label: "Knowledge Source", value: "Wikipedia 21M passage index" }
    ],
    researchProblem: "Pure parametric LLMs suffer from hallucination, inability to update knowledge without retraining, and lack of verifiable citations for generated facts.",
    method: "Introduces RAG-Sequence and RAG-Token architectures. The retriever extracts top-K document passages based on dot-product similarity between query and passage vectors, which are then passed to the generator to synthesize grounded responses.",
    results: "Sets new state-of-the-art results on Open-Domain QA datasets (Natural Questions, TriviaQA, WebQuestions) and significantly improves factual accuracy on MS-MARCO.",
    sampleQuestions: [
      "What is the difference between RAG-Sequence and RAG-Token?",
      "How does RAG update its knowledge without retraining?",
      "What retriever model was used in the original RAG paper?"
    ],
    qaHistory: [
      {
        id: "qa-rag-1",
        question: "How does RAG cite sources for generated answers?",
        answer: "RAG retrieves specific document chunks from vector storage prior to generation. The generator's probability distribution is conditioned directly on these retrieved chunks, making each statement traceable back to specific document IDs and page numbers.",
        sources: [
          {
            page: 3,
            chunk: 8,
            text: "Non-parametric memory returns document passages z with metadata including Wikipedia title and section offset, providing transparent provenance for generated output."
          }
        ]
      }
    ]
  },
  {
    id: "resnet-2015",
    title: "Deep Residual Learning for Image Recognition",
    authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
    year: 2015,
    category: "Computer Vision",
    pages: 12,
    pdfPath: "Data/resnet.pdf",
    abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.",
    overview: "ResNet introduced identity shortcut connections that allow gradients to flow directly through hundreds of layers without vanishing or exploding, enabling networks as deep as 152 layers to win the ImageNet challenge.",
    keyInformation: [
      { label: "Core Innovation", value: "Shortcut / Skip Connections" },
      { label: "Max Depth", value: "152 layers (ResNet-152)" },
      { label: "ImageNet Error", value: "3.57% top-5 error" },
      { label: "Impact", value: "Foundational architecture for modern vision and transformers" }
    ],
    researchProblem: "As deep networks increase in depth, accuracy saturates and then degrades rapidly due to the degradation problem, where deeper networks exhibit higher training error than shallow ones.",
    method: "Instead of hoping layers fit a desired underlying mapping H(x), ResNet lets layers fit a residual mapping F(x) = H(x) - x, reformulating the layer output to F(x) + x via identity skip connections.",
    results: "ResNet won 1st place in ImageNet 2015 classification, detection, and localization competitions, reducing top-5 error to 3.57% and outperforming human accuracy.",
    sampleQuestions: [
      "What is the degradation problem in deep networks?",
      "How do skip connections resolve vanishing gradients?",
      "What was ResNet's top-5 error rate on ImageNet?"
    ],
    qaHistory: []
  },
  {
    id: "gpt3-2020",
    title: "Language Models are Few-Shot Learners",
    authors: "Tom B. Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared Kaplan",
    year: 2020,
    category: "Large Language Models",
    pages: 75,
    pdfPath: "Data/gpt3.pdf",
    abstract: "We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance. We train GPT-3, an autoregressive language model with 175 billion parameters, 10x larger than any previous non-sparse language model, and evaluate its performance in zero-shot, one-shot, and few-shot settings.",
    overview: "GPT-3 established that scaling dense auto-regressive transformer models to 175 billion parameters enables strong zero-shot and few-shot capabilities across diverse NLP benchmarks without fine-tuning gradient updates.",
    keyInformation: [
      { label: "Parameter Count", value: "175 Billion Parameters" },
      { label: "Context Window", value: "2048 tokens" },
      { label: "Architecture", value: "Decoder-only Transformer" },
      { label: "Training Data", value: "300B tokens (Filtered Common Crawl, WebText2, Books, Wikipedia)" }
    ],
    researchProblem: "Task-specific fine-tuning requires thousands of labeled domain examples for every new task, limiting general-purpose AI deployment.",
    method: "Train a 175B parameter transformer decoder on massive web text and evaluate pure prompt-conditioned generation using 0, 1, or a few in-context demonstration examples.",
    results: "GPT-3 achieves strong performance on translation, QA, cloze tasks, and code synthesis without gradient fine-tuning.",
    sampleQuestions: [
      "How many parameters does GPT-3 contain?",
      "What is the difference between zero-shot and few-shot prompting?",
      "What datasets were used to pre-train GPT-3?"
    ],
    qaHistory: []
  },
  {
    id: "lora-2021",
    title: "LoRA: Low-Rank Adaptation of Large Language Models",
    authors: "Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li",
    year: 2021,
    category: "Model Fine-Tuning & Optimization",
    pages: 14,
    pdfPath: "Data/lora.pdf",
    abstract: "We propose Low-Rank Adaptation (LoRA), which freezes pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.",
    overview: "LoRA reduces the number of trainable parameters by up to 10,000x and GPU memory requirement by 3x when fine-tuning large language models like GPT-3 or LLaMA, without sacrificing task performance or adding inference latency.",
    keyInformation: [
      { label: "Parameter Reduction", value: "Up to 10,000x fewer trainable parameters" },
      { label: "Memory Savings", value: "3x reduction in VRAM overhead" },
      { label: "Inference Latency", value: "Zero added latency (matrices merged at deploy time)" },
      { label: "Target Layers", value: "Attention weight projections (W_q, W_v)" }
    ],
    researchProblem: "Full parameter fine-tuning of 100B+ LLMs requires massive GPU cluster memory and yields heavy model checkpoint storage per domain task.",
    method: "Freeze W_0 in R^(d x k) and decompose weight updates delta_W into low-rank matrices A in R^(r x k) and B in R^(d x r) where rank r << min(d, k).",
    results: "Matches or exceeds full fine-tuning performance on RoBERTa, DeBERTa, and GPT-2/3 while requiring only 0.01% trainable parameters.",
    sampleQuestions: [
      "How does LoRA decompose matrix updates?",
      "Why does LoRA add zero latency during inference?",
      "What rank r is typically used in practice?"
    ],
    qaHistory: []
  }
];

export const MOCK_CATEGORIES = [
  "All Categories",
  "Natural Language Processing",
  "Information Retrieval & RAG",
  "Computer Vision",
  "Large Language Models",
  "Model Fine-Tuning & Optimization"
];

export const MOCK_YEARS = ["All Years", "2023", "2021", "2020", "2015"];
