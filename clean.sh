git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r "backend/node_modules - Copia"' --prune-empty --tag-name-filter cat -- --all
