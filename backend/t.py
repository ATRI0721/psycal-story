from sentence_transformers import SentenceTransformer

# 只运行这一行，看看是否会成功
embedder = SentenceTransformer("C:\\Users\\Chtholly\\.cache\\huggingface\\hub\\models--BAAI--bge-large-zh\\snapshots\\b5d9f5c027e87b6f0b6fa4b614f8f9cdc45ce0e8")
print("模型加载成功！")