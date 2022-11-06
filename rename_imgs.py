import os
import sys


def main():
    dir = sys.argv[1]
    files = [f for f in os.listdir(dir) if os.path.isfile(f)]
    for filename in files:
        no_ext = filename.replace('.jpg', '')
        name = no_ext.split('_')
        new_name = f"{name[0]}.jpg"

        if new_name != filename:
            print(f"{filename} --> {new_name}")
            os.rename(filename, new_name)


if __name__ == '__main__':
    main()
