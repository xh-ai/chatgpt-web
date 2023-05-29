import csv
import uuid

def generate_serial_number():
    # 生成一个UUID并转化为字符串，移除短横线，转化为小写，然后取前9个字符
    id = str(uuid.uuid4()).replace('-', '').lower()[:9]
    # 将字符串格式化为000-000-000的形式
    return "{}-{}-{}".format(id[:3], id[3:6], id[6:])

def write_to_csv(serial_numbers, file_name):
    with open(file_name, mode='w', newline='') as file:
        writer = csv.writer(file)
        for sn in serial_numbers:
            # 写入序列号
            writer.writerow([sn])

# 生成100个序列号
serial_numbers = [generate_serial_number() for _ in range(100)]
# 将序列号写入CSV文件
write_to_csv(serial_numbers, 'serial_numbers.csv')

