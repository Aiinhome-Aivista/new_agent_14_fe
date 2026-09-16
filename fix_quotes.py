import re

file_path = r'e:\Pwc_Agent\VCO Agent-14\new_agent_14_fe\src\pages\ProjectDrilldown.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("\\'None\\'", "'None'")
content = content.replace("\\'Pending\\'", "'Pending'")
content = content.replace("\\'TBD\\'", "'TBD'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
