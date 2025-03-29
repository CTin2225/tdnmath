import pandas as pd

keymap = {
    "Timestamp": "timestamp",
    "Email Address": "email",
    "Duyệt": "rating",
    "Độ khó\n1 = trẻ em\n2 = đọc hiểu\n3 = dễ\n4 = trung bình\n5 = khó": "difficulty",
    "Câu hỏi": "question",
    "Hình ảnh": "image",
    "Lựa chọn A": "a",
    "Lựa chọn B": "b",
    "Lựa chọn C": "c",
    "Lựa chọn D": "d",
    "Đáp án đúng (ghi vào other nếu trả lời ngắn)": "answer",
    "Bài giải/Giải thích (dấu nhân xài *, dấu chia xài /)": "explanation",
    "Ghi chú": "note",
}

df = pd.read_excel("questions.xlsx")
df = df.rename(columns=keymap)
df["id"] = df.index + 1
df = df[df["rating"] == "Nhận"]
df["choices"] = df[["a", "b", "c", "d"]].apply(lambda x: [i for i in x if pd.notnull(i)], axis=1)
df["difficulty"] = df["difficulty"].apply(lambda x: int(x) if pd.notnull(x) else None)
df["answer"] = df["answer"].apply(
    lambda x: None if pd.isnull(x) else ord(str(x).upper()) - ord("A") if len(x) == 1 and str(x).upper() in ["A", "B", "C", "D"] else x
)
df = df.drop(columns=["timestamp", "email", "rating", "note", "a", "b", "c", "d"], errors="ignore")

with open("./src/static/questions.json", "w", encoding="utf-8") as f:
    f.write(df.to_json(orient="records", force_ascii=False, indent=2))
