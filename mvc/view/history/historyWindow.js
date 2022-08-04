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
            'Latency',
            'Jitter',
            'UpdateAt',
            'ISP',
            'Server',
            'Server City',
            'Server Country',
            'Network Interface',
            'URL'
        ].map(c => ({data: c})),
        columnDefs: [{
            target: 11,
            render: (data, type, row, meta) => {
                return `<a target="_blank" href="${data}">Result</a>`;
            }
        }]
    });
});

window.electronAPI.on("speed-history-data", (event, data) => {
    const table = $('#table_speed_history').DataTable();
    table.clear().draw();
    table.rows.add(data).order([0, "desc"]).draw();
});
