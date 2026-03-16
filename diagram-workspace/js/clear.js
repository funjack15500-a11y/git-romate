/**
 * Copyright (c) 2020-2025, JGraph Holdings Ltd
 * Copyright (c) 2020-2025, draw.io AG
 */
try
{
    function write(text)
    {
        document.getElementById('content').appendChild(document.createTextNode(text));
    }

    function writeln(text)
    {
        write(text);
        document.getElementById('content').appendChild(document.createElement('br'));
    }

    writeln('Clearing local cached data for version ' + EditorUi.VERSION + '...');

    function appendButton(label, className, onClick)
    {
        var button = document.createElement('button');
        button.textContent = label;

        if (className)
        {
            button.className = className;
        }

        button.addEventListener('click', onClick);
        document.getElementById('content').appendChild(button);
    }

    if (navigator.serviceWorker != null)
    {
        navigator.serviceWorker.getRegistrations().then(function(registrations)
        {
            if (registrations != null && registrations.length > 0)
            {
                for (var i = 0; i < registrations.length; i++)
                {
                    registrations[i].unregister();
                }

                writeln('Done');
            }
            else
            {
                writeln('Nothing to clear.');
            }

            writeln('');
            appendButton('Reload', '', function()
            {
                window.location.reload();
            });
            appendButton('Open App', 'secondary', function()
            {
                window.location.href = './';
            });
        });
    }
    else
    {
        writeln('This browser has no service worker cache for this page.');
        writeln('');
        appendButton('Open App', '', function()
        {
            window.location.href = './';
        });
    }
}
catch (e)
{
    write('Error: ' + e.message);
}
