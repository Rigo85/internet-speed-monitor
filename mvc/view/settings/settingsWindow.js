$(document).ready(function () {
    $('select').formSelect();

    $("#select_refresh_time").on("change", (event) => {
        window.electronAPI.send("update-refresh-time", $(this).find(":selected").val());
    });
});

window.electronAPI.on("settings-data", (event, data) => {
    // {"id":1,"refreshTime":300000,"intervalId":18}
    const refreshTime = (data || {"refreshTime": 300000}).refreshTime / 1000 / 60;
    $(`#select_refresh_time option[value="${refreshTime}"]`).prop("selected", true);
    $('select').formSelect();
});
