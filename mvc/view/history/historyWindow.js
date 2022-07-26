$(document).ready(function () {
    $('#table_speed_history').DataTable({
        "lengthMenu": false,
        "bLengthChange": false,
        "pageLength": 10,
        dom: 'Bfrtip',
        buttons: [
            'excel'
        ],
        data: [],
        columns: [
            'id',
            'DownloadSpeed',
            'UploadSpeed',
            'Ping',
            'Jitter',
            'UpdateAt',
            'ISP',
            'Server',
            'Server Country',
            'Server City',
            'Server Distance'].map(c => ({data: c}))
    });
});

window.electronAPI.on("speed-history-data", (event, data) => {
    const table = $('#table_speed_history').DataTable();
    table.clear().draw();
    table.rows.add(data).order([0, "desc"]).draw();
});
