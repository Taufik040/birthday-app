import os
import io
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from supabase import create_client, Client

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'retro-birthday-secret')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

# ── Supabase client ──
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
BUCKET       = 'birthday'

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None

ALLOWED_MUSIC  = {'mp3', 'wav', 'ogg', 'm4a'}
ALLOWED_PHOTOS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MIME_MAP = {
    'mp3': 'audio/mpeg', 'wav': 'audio/wav',
    'ogg': 'audio/ogg',  'm4a': 'audio/mp4',
    'png': 'image/png',  'jpg': 'image/jpeg',
    'jpeg':'image/jpeg', 'gif': 'image/gif',
    'webp':'image/webp',
}

def allowed_file(filename, allowed_set):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set

def get_ext(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def public_url(path):
    return supabase.storage.from_(BUCKET).get_public_url(path)

def list_folder(prefix):
    try:
        items = supabase.storage.from_(BUCKET).list(prefix.rstrip('/'))
        return [f['name'] for f in items if f.get('name') and not f['name'].startswith('.')]
    except Exception:
        return []

def list_music():
    return sorted([f for f in list_folder('music') if allowed_file(f, ALLOWED_MUSIC)])

def list_photos():
    return sorted([f for f in list_folder('photos') if allowed_file(f, ALLOWED_PHOTOS)])

def music_urls():
    return [{'name': f, 'url': public_url(f'music/{f}')} for f in list_music()]

def photo_urls():
    return [{'name': f, 'url': public_url(f'photos/{f}')} for f in list_photos()]


@app.route('/')
def index():
    return render_template('index.html', music_files=music_urls(), photos=photo_urls())

@app.route('/view')
def view_page():
    return render_template('view.html', music_files=music_urls(), photos=photo_urls())

@app.route('/get_files')
def get_files():
    return jsonify({'music': music_urls(), 'photos': photo_urls()})


@app.route('/upload_music', methods=['POST'])
def upload_music():
    if 'music' not in request.files:
        return jsonify({'error': 'Tidak ada file'}), 400
    file = request.files['music']
    if not file or not file.filename:
        return jsonify({'error': 'File kosong'}), 400
    if not allowed_file(file.filename, ALLOWED_MUSIC):
        return jsonify({'error': 'Format tidak didukung. Gunakan MP3/WAV/OGG/M4A'}), 400
    filename = secure_filename(file.filename)
    mime     = MIME_MAP.get(get_ext(filename), 'audio/mpeg')
    data     = file.read()
    try:
        supabase.storage.from_(BUCKET).upload(
            f'music/{filename}', data,
            file_options={'content-type': mime, 'upsert': 'true'}
        )
        return jsonify({'success': True, 'filename': filename, 'url': public_url(f'music/{filename}')})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/upload_photos', methods=['POST'])
def upload_photos():
    files    = request.files.getlist('photos')
    uploaded = []
    skipped  = []
    for file in files:
        if not file or not file.filename:
            continue
        if not allowed_file(file.filename, ALLOWED_PHOTOS):
            skipped.append(file.filename); continue
        filename = secure_filename(file.filename)
        mime     = MIME_MAP.get(get_ext(filename), 'image/jpeg')
        data     = file.read()
        try:
            supabase.storage.from_(BUCKET).upload(
                f'photos/{filename}', data,
                file_options={'content-type': mime, 'upsert': 'true'}
            )
            uploaded.append({'name': filename, 'url': public_url(f'photos/{filename}')})
        except Exception:
            skipped.append(filename)
    return jsonify({'success': True, 'files': uploaded, 'skipped': skipped})


@app.route('/delete_music/<filename>', methods=['DELETE'])
def delete_music(filename):
    try:
        supabase.storage.from_(BUCKET).remove([f'music/{secure_filename(filename)}'])
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/delete_photo/<filename>', methods=['DELETE'])
def delete_photo(filename):
    try:
        supabase.storage.from_(BUCKET).remove([f'photos/{secure_filename(filename)}'])
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
